const Koa = require('koa');
const router = require('koa-router')();
const fs = require('fs');
const pathOperator = require('path');
const stream = require('stream');

const app = new Koa();

app.use(async (ctx, next) => {
    console.log('receive request', ctx.request.method, ctx.request.url);
    await next();
});

router.get('/floorsList', async (ctx, next) => {
    const list = ['floor1', 'floor2', 'floor3', 'floor4', 'floor5', 'floor6', 'floor7', 'floor8'];
    ctx.response.status = 200;
    ctx.response.body = list;
});

router.get('/model/:fileName', async (ctx, next) => {
    const fileName = ctx.params.fileName;
    const path = pathOperator.join(__dirname, `model/${fileName}`);
    // fs.readFile(path, 'binary', (err, file) => {
    //     if(err) {
    //         console.error(`model ${path} not found`);
    //         ctx.response.status = 404;
    //         return;
    //     } else {
    //         // const buf = new Buffer(file);
    //         // ctx.response.body = buf;

    //     }
    // });
    ctx.response.set('accept-ranges', 'bytes');
    ctx.body = fs.createReadStream(path, 'binary')
        .on('error', ctx.onerror)
        .pipe(stream.PassThrough());
});

app.use(router.routes());

app.listen(3000);
console.log('server start...');
