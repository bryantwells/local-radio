const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const WebSocket = require('ws');
const SourceList = require('./websocket/modules/source-list');

// dotenv
require('dotenv').config();

// express and websocket server
const app = express();
const wss = new WebSocket.Server({ noServer: true });

// routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const newRouter = require('./routes/new');
const stationRouter = require('./routes/station');
const streamRouter = require('./routes/stream');
const helpRouter = require('./routes/help');

process.env.DEBUG_MODE = Number(process.env.DEBUG_MODE);

// credential
const credentials = {
    admin: {
        user: process.env.ADMIN_USER,
        pass: process.env.ADMIN_PASS,
    },
    source: {
        user: process.env.SOURCE_USER,
        pass: process.env.SOURCE_PASS,
    },
};

app.set('sourceList', new SourceList(credentials));
app.wss = wss;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/new', newRouter);
app.use('/station', stationRouter);
app.use('/stream', streamRouter);
app.use('/help', helpRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
app.use((err, req, res) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
