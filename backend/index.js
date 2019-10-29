const Koa = require('koa');
const router = require('koa-router')();
const fs = require('fs');
const pathOperator = require('path');

const app = new Koa();

app.use(async (ctx, next) => {
    console.log('receive request', ctx.request.method, ctx.request.url);
    await next();
});

router.get('/floorsList', async(ctx, next) => {
    const list = ['floor1', 'floor2', 'floor3', 'floor4', 'floor5', 'floor6', 'floor7', 'floor8'];
    ctx.response.status = 200;
    ctx.response.body = list;
});

router.get('/model', async(ctx, next) => {
    const path = pathOperator.join(__dirname, 'model/building.fbx');
    fs.readFile(path, 'binary', (err, file) => {
        if(err) {
            console.error(`model ${path} not found`);
            ctx.response.status = 404;
            return;
        } else {
            // ctx.res.writeHead(200);
            // ctx.res.write(file, 'binary');
            // ctx.res.end();
            // console.log(file);
            ctx.response.status = 200;
            // ctx.response.body = {code:'success'};
        }
    });
});

app.use(router.routes());

app.listen(3000);
console.log('server start...');
