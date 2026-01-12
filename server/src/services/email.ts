import https from 'https';

interface EmailParams {
    to_email: string;
    otp: string;
}

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
        console.warn('EmailJS credentials not found in environment variables. OTP email not sent. Check EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY');
        return;
    }

    const data = JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
            to_email: email,
            otp_code: otp,
            reply_to: 'patikayuva@gmail.com'
        }
    });

    const options = {
        hostname: 'api.emailjs.com',
        port: 443,
        path: '/api/v1.0/email/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            // EmailJS returns 200 for success
            if (res.statusCode === 200) {
                resolve();
            } else {
                let responseBody = '';
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
                res.on('end', () => {
                    console.error('EmailJS Error Status:', res.statusCode);
                    console.error('EmailJS Error Body:', responseBody);
                    reject(new Error(`EmailJS failed with status ${res.statusCode}: ${responseBody}`));
                });
            }
        });

        req.on('error', (error) => {
            console.error('EmailJS Request Error:', error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
};
