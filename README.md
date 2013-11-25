# praha: a node.js micro-framework #

Yes, another node.js framework. One that will try to help you while trying not to raising your technical debt.

# Features #
Current features:

- Used on top of express.
- Micro-components only. Nothing is loaded unless you ask for it.
- Inspired by a framework-hater's use of RoR 4.
- Intelligent routing inspired by Rail's "before_action".

Coming soon:

 - Kinda a bit Active-Record like objects management.

Goals:

 - Separation of concerns. No two modules must ever be dependent of one another.
 - No intrusive patterns, no DSL to learn, no unexpected behaviours, no "it's my way or the highway",...
 - Only use the minimal amount of "convention-over-configuration" and automation of tasks.

# Installation #

    $ npm install praha
No -g folly. This is designed to ease your life, not make you learn how to use a new CLI tool.


# Routing #

Just have all your routes together in a folder (or in two or more folders if you feel like a rebel). If you want to follow even better practices, you separate your resources in multiple files (ie: one resource per file seems like a good ratio).

All functions exported from a .js file are mapped to routes __based on their export key's name__. Since praha is designed to be non-intrusive, your `module.exports` must also contain a `_praha` key whose value is truthy to opt-in for usage by praha.

To use the praha router in your express app, simply use it as a middleware with the path to your route folder as an argument.

    app.use(require('praha/lib/router')(__dirname + '/routes'));

If you have routes in multiple folders, you can of course use the middleware multiple times.

## Default Rails-style mapping ##
The first way to define routes is to follow Rails conventions: index, show, new, create, edit, update and delete will map to the same routes these methods generate in Rails.

    // in a file named "articles.js"
    index   // GET /articles
    show    // GET /articles/:id
    new     // GET /articles/new
    create  // POST /articles
    edit    // GET /articles/:id/edit
    update  // PUT /articles/:id
    delete  // DELETE /articles/:id

This should be enough for basic CRUD. Note that you can opt-out any time you want: only use `index` and `show`, don't use `create` and `edit`,... you're free to go another way.

## Custom routes mapping ##
The second way (custom-diy) is to write your routes in camelCases. If the first word is one of get/post/put/delete, it will be used as the method. Otherwise, the default method is `GET`. All following words will then tie to a subfolder.

    // in a file named "articles.js"
    getLatest   // GET /articles/latest
    postCurrent     // POST /articles/current

If your route needs to use parameters capture, specify the parameters name in an array tied to the `parameters` value of your route function. In simpler words:

    // in a file named "articles.js"
    function getId(req,res,next) {};
    function deleteCommentsComment(req,res,next) {};
    getId.parameters = ['id'];
    deleteIdCommentsComment.parameters = ['id','comment'];

    // Will result in
    GET /articles/:id
    DELETE /articles/:id/comments/:comment

You can also remove the "/articles" prefix (or use another prefix) by setting the `_alias` key in your exports to false or to the alias string.

    // in a file named "sessions.js"
    module.exports = {
      _praha: true,
      _alias: false,
      postLogin: function(req,res,next){},
      deleteLogout: function(req,res,next){}
    }

    // Will result in
    POST /login
    DELETE /logout

## Using beforeAction to tie multiple logics to a route ##
Similar to Rail's `before_action`, you can specify multiple middlewares that will be passed before specifics routes. No DSL though. Just set your route's `beforeAction` key to an array of middlewares you want to pass through.

    // in a file named "articles.js"
    function getId(req, res, next) { // GET /articles/:id
      // TODO: Render article
    }

    function putId(req, res, next) { // PUT /articles/:id
      // TODO: Edit article
    }

    function deleteId(req, res, next) { // DELETE /articles/:id
      // TODO: Delete article
    }

    function beforeSetArticle(req, res, next) {
      // TODO: Find article in DB and tie it to `req` or 404.
    }
    function beforeCheckUserIsSelfOrAdmin(req, res, next) {
      // TODO: Check user is playing with his own post or 401
    }

    [getId, putId, deleteId].forEach(function (c) {
      c.parameters = ['id'];
    });

    getId.beforeAction = [ beforeSetArticle ];
    [getId, putId, deleteId].forEach(function (c) {
      c.beforeAction = [ beforeSetArticle, beforeCheckUserIsSelfOrAdmin ];
    });

Here are the routes you will get and the middlewares they will pass through:

    GET /articles/:id
    - beforeSetArticle
    - getId

    PUT /articles/:id
    - beforeSetArticle
    - beforeCheckUserIsSelfOrAdmin
    - putId

    DELETE /articles:
    - beforeSetArticle
    - beforeCheckUserIsSelfOrAdmin
    - deleteId

# Debug #

The [debug module by visionmedia](https://github.com/visionmedia/debug) is used for debugging. Everything runs under the "praha" namespace. To see what goes under the hood, try `DEBUG=praha* node app.js`.
