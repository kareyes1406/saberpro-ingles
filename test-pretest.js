const { showPreTest } = require('./controllers/examController');
const { poolPromise } = require('./config/database');

async function test() {
    await poolPromise;
    const req = {
        session: {
            userId: 2 // Assuming student userId is 2
        }
    };
    const res = {
        redirect: (url) => console.log('Redirect:', url),
        render: (view, data) => console.log('Render:', view),
        status: (code) => {
            console.log('Status:', code);
            return {
                send: (msg) => console.log('Send:', msg)
            };
        }
    };
    
    try {
        await showPreTest(req, res);
    } catch (e) {
        console.error("Caught error:", e);
    }
    process.exit(0);
}

test();
