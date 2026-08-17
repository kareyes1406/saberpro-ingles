const { showPreTest } = require('./controllers/examController');
const { poolPromise } = require('./config/database');
const path = require('path');
const ejs = require('ejs');

async function test() {
    await poolPromise;
    const req = {
        session: { userId: 2 }
    };
    const res = {
        redirect: (url) => console.log('Redirect:', url),
        status: (code) => {
            console.log('Status:', code);
            return { send: (msg) => console.log('Send:', msg) };
        },
        render: async (view, data) => {
            console.log('Rendering view:', view);
            const viewPath = path.join(__dirname, 'views', view + '.ejs');
            try {
                // Add flash messages usually available via res.locals
                data.success_msg = [];
                data.error_msg = [];
                data.error = [];
                
                const html = await ejs.renderFile(viewPath, data, { views: [path.join(__dirname, 'views')] });
                console.log('Render Success! Length:', html.length);
            } catch (err) {
                console.error('Render Error:', err);
            }
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
