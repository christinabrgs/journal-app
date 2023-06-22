module.exports = function(app, passport, db) {
const ObjectID = require('mongodb').ObjectID
const journalEntries = db.collection('entries')
// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('messages').find().toArray((err, result) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
          })
        })
    });

    app.get ('/journal', isLoggedIn, async (req, res) => {
      journalEntries.find({userId: req.user._id}).toArray((err, result) => {
        console.log(result)
        if (err) return console.log(err)
        res.render('journal.ejs', {
          entries: result
        })
      })
    }) 

    app.get ('/bookmarked', async (req, res) => {
      journalEntries.find({userId: req.user._id}).toArray((err, result) => {
        console.log(result)
        if (err) return console.log(err)
        res.render('bookmarked.ejs', {
          entries: result
        })
      })
    }) 

    app.post ('/entries', async(req, res) => {
      journalEntries.insertOne({userId: req.user._id, date: req.body.date, entry: req.body.entry, bookmark: false}, (err, result) => {
        console.log(result)
        if (err) return res.send(err)
        res.redirect('/profile')
      })
    })
    
    app.put('/bookmarks', (req, res) => {
      console.log('body', req.body)

      journalEntries
        .findOneAndUpdate({ _id: ObjectID(req.body.id) }, 
        [
          { $set: { bookmark: { $not: "$bookmark" } } }
        ]
        , (err, result) => {
          if (err) return res.send(err)
          res.send(result)
        })
    })

    app.delete('/journal', (req, res) => {
      journalEntries.findOneAndDelete({date: req.body.date, entry: req.body.entry}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

    

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out!')
        });
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/messages', (req, res) => {
      db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })



    app.delete('/messages', (req, res) => {
      db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
