import Fastify from 'fastify';
import { routes } from './routes/index.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { notificationQueue, notificationDLQ } from '@project/broker';

const app = Fastify({ logger: true });

app.get('/health', () => {
    return { status: 'ok' }
})

app.register(routes, {
    prefix: '/api'
})

// 3. Setup Bull-Board Dashboard for Queue Monitoring
const serverAdapter = new FastifyAdapter();
createBullBoard({
    queues: [
        new BullMQAdapter(notificationQueue),
        new BullMQAdapter(notificationDLQ)
    ],
    serverAdapter: serverAdapter,
});
serverAdapter.setBasePath('/admin/queues');
app.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' });

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