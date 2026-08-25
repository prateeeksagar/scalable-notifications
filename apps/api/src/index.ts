import Fastify from 'fastify';
import { routes } from './routes/index.js';

const app = Fastify({ logger: true });

app.get('/health', () => {
    return { status: 'ok' }
})

app.register(routes, {
    prefix: '/api'
})

const start = async () => {
    try {
        app.listen({ port: 3000, host: '127.0.0.1' }, (err, address) => {
            console.log("server started ")
            if (err) {
                app.log.error(err)
                process.exit(1)
            }
        })
    } catch (err) {
        app.log.error(err);
        process.exit(1)
    }
}

start();