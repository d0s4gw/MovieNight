const app = require('./app');
const db = require('./database');
const PORT = process.env.PORT || 3001;

// Start Server & Graceful Shutdown
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully.');
    server.close(() => {
        console.log('Closed out remaining connections.');
        db.close((err) => {
            if (err) {
                console.error('Error closing database connection:', err.message);
                process.exit(1);
            }
            console.log('Database connection closed.');
            process.exit(0);
        });
    });

    // Force close after 10s
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
