import { BasicService, UserAgent } from './lib'
import { JSDOM } from 'jsdom'

export class LuoguAccountService extends BasicService {
    constructor(
        public log: (...contents: any[]) => void,
    ) {
        super('https://www.luogu.com.cn', log);
        this.header = {
            'X-Requested-With': 'XMLHttpRequest',
            Referer: 'https://www.luogu.com.cn/',
            'User-Agent': UserAgent,
        };
    }

    async getCookie() {
        const response = await this.get('/');
        this.cookie = response.headers['set-cookie'];
        this.log(this.cookie);
    }

    async getLoginCaptcha() {
        await this.getCookie();
        const response = await this.get('/user/setting');
        const { window: { document } } = new JSDOM(response.text);
        this.postHeader['X-Csrf-Token'] = document
            .querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const captcha = await this.get(`/api/verify/captcha`)
            .query({ _t: new Date().getTime() });
        return captcha.body;
    }
    login(username: string, password: string, captcha: string) {
        return new Promise((resolve) =>
            this.post('/api/auth/userPassLogin')
                .set('referer', 'https://www.luogu.com.cn/user/setting')
                .send({ username, password, captcha })
                .end(async (err, { body, header }) => {
                    if (body.errorMessage) {
                        this.log(body.errorMessage)
                        resolve(false);
                    }
                    else {
                        this.cookie[1] = header['set-cookie'][0];
                        this.log(this.cookie);
                        resolve(true);
                    }
                })
        );
    }
}