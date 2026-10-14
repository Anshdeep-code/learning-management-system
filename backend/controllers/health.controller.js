import { getDBStatus } from '../database/db.js';

export const checkHealth = async (req, res) => {
    const db = getDBStatus();
    const healthy = db.readyState === 1;

    // 200 when everything works, 503 so load balancers / uptime monitors can react
    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        database: {
            status: getReadyStateText(db.readyState),
            readyState: db.readyState
        },
        memory: {
            rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        }
    });
};

function getReadyStateText(state) {
    // mongoose.connection.readyState values
    switch (state) {
        case 0: return 'disconnected';
        case 1: return 'connected';
        case 2: return 'connecting';
        case 3: return 'disconnecting';
        default: return 'unknown';
    }
}
