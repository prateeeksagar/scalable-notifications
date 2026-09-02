import autocannon from "autocannon";
import crypto from 'crypto'

console.log('starting high thoughput ingestion benchmark')

const instance = autocannon({
    url: 'http://localhost:3000/api/v1/notification',
    connections: 100,
    duration: 15,
    pipelining: 2,
    method: 'POST',
    headers: {
        'content-type': 'application/json'
    },
    // dynamically generate unique email and idempotency keys per request
    requests: [
        {
            setupRequest: (req) => {
                const uniqueId = crypto.randomUUID();
                req.headers['idempotency-key'] = `bench_${uniqueId}`;
                req.body = JSON.stringify({
                    channel: 'SMS',
                    priority: 'HIGH',
                    payload: {
                        to: '+919876543210',
                        body: `Benchmark notification payload: ${uniqueId}`
                    }
                });
                return req;
            }
        }
    ]
}, (err, result) => {
    if (err) {
        console.error('Benchmark error:', err);
    } else {
        console.log('\n=========================================');
        console.log('🎉 BENCHMARK RESULTS');
        console.log('=========================================');
        console.log(`Requests/sec: ${result.requests.average.toFixed(2)} req/s`);
        console.log(`Throughput:   ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
        console.log(`Latency p50:  ${result.latency.p50} ms`);
        console.log(`Latency p95:  ${result.latency.p95} ms`);
        console.log(`Latency p99:  ${result.latency.p99} ms`);
        console.log(`Total Reqs:   ${result.requests.total}`);
        console.log(`2xx Responses:${result['2xx']}`);
        console.log(`Errors (5xx): ${result['5xx']}`);
        console.log('=========================================\n');
    }
})

autocannon.track(instance, { renderProgressBar: true })