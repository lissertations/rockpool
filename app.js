// require modules
const settings = require('./settings.json') // local settings file (leave at top)
const express = require('express') // express
const app = express(); // still express
const engines = require('consolidate') // use consolidate for template engine
const db = require('./queries.js'); // local database queries file

// set template views
app.set('views', __dirname + '/views');
app.set('partials', __dirname + '/partials');
app.engine('html', engines.whiskers);
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public')) // serve static files from 'public' directory

/*

// create text index
// TODO: this is in the wrong place. Pull it all out into a separate file to be run once on install.
const url = process.env.MONGO_URL // Connection URL
const dbName = process.env.MONGO_DB_NAME // Database Name
MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  // create text index for search to work
  db.collection('articles').createIndex(
    {
      blog: "text",
      categories: "text",
      title: "text"
    }, function(err, result) {
      if (err) {
        console.error(`Error with text index: ${err.codeName}`)
      }
      else {
        console.log('text index ok')
      }
    }
  )
  // create categories index for faster tag browsing
  db.collection('articles').createIndex(
    {
      categories : 1
    }, function(err, result) {
      if (err) {
        console.error(err.codeName)
      } else {
        console.log('categories index ok')
      }
    }
  )
})

// TODO: we never actually close the DB here? Fix.

*/

// ++++++++++
// NAVIGATION
// ++++++++++

// home
app.get('/', (req, res) =>
  Promise.all([db.getArticles(), db.getTopTags])
	.then( function(vals) {
		newVals = vals.reduce( function(result, item, index) {
			let key = Object.keys(item)[0];
			result[key] = item[key]
			return result
		}, {});
		res.render('index', {
			partials: {
        articleList: __dirname+'/partials/articleList.html',
        foot: __dirname+'/partials/foot.html',
        footer: __dirname+'/partials/footer.html',
        head: __dirname+'/partials/head.html',
        header: __dirname+'/partials/header.html',
        search: __dirname+'/partials/search.html',
        searchNav: __dirname+'/partials/searchNav.html',
        toptags: __dirname+'/partials/toptags.html'
      },
			articles: newVals.articles,
      tags: newVals.tags,
      test: app.locals.localstest
		})
	})
	.catch(err => console.error(err))
)

// search
app.get('/search/', (req, res) => db.getArticles(req.query.tag, req.query.page, req.query.q, req.query.month)
	.then( docs => res.render('tag', {
			partials: {
				articleList: __dirname+'/partials/articleList.html',
				search: __dirname+'/partials/search.html',
				head: __dirname+'/partials/head.html',
				foot: __dirname+'/partials/foot.html',
				header: __dirname+'/partials/header.html',
        footer: __dirname+'/partials/footer.html',
        searchNav: __dirname+'/partials/searchNav.html',
			},
			articles: docs.articles,
      searchterm: req.query.tag ? req.query.tag : req.query.q,
      tag: req.query.tag,
      searchTermEncoded: req.query.tag ? 'tag=' + encodeURIComponent(req.query.tag) : req.query.q ? 'q=' + encodeURIComponent(req.query.q) : '',
      next: req.query.page ? Number(req.query.page) + 1 : 1,
      prev: Number(req.query.page) - 1,
      prevExists: Number(req.query.page) != NaN ? Number(req.query.page) : false,
      month: req.query.month,
      monthName: docs.monthName
		})
	)
  .catch(err => console.error(err))
)

// subscribe
app.get('/subscribe', function (req, res) {
  res.render('subscribe', {
    partials: {
      head: __dirname+'/partials/head.html',
      header: __dirname+'/partials/header.html',
      foot: __dirname+'/partials/foot.html',
      footer: __dirname+'/partials/footer.html'
    }
  })
})

// TODO: /letmein (register and login)

// TODO: /user

// TODO: /author (for verifying owners)

// TODO: /admin

// 404
app.use(function (req, res, next) {
  res.status(404).render("404")
})

// listen on server
app.listen(3000, function() {
  console.log('    *****************************************************************************')
  console.log('     👂  Rockpool is listening on port 3000')
  console.log(`     👟  You are running in ${process.env.NODE_ENV.toUpperCase()} mode`)
  console.log(`     🗃  Connected to database at ${settings[process.env.NODE_ENV].mongo_url}`)
  console.log('    *****************************************************************************')
})