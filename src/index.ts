import { BasicService, UserAgent } from './lib'
import { writeFileSync } from 'fs'
import superagent from 'superagent'
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

    async reset() {
        this.cookie = [];
        delete this.postHeader['X-Csrf-Token'];
    }

    async getCookie() {
        const response = await this.get('/');
        this.cookie = response.headers['set-cookie'];
        this.log(this.cookie);
    }

    async getLoginCaptcha(autosave?: string) {
        await this.getCookie();
        const response = await this.get('/user/setting');
        const { window: { document } } = new JSDOM(response.text);
        this.postHeader['X-Csrf-Token'] = document
            .querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const { body: captcha } = await this.get(`/api/verify/captcha`)
            .query({ _t: new Date().getTime() });
        if (autosave) writeFileSync(autosave, captcha, "binary");
        return captcha;
    }
    login(username: string, password: string, captcha: string): Promise<Boolean> {
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
    async autoLogin(username: string, password: string, retry: number = 2): Promise<Boolean> {
        this.reset();
        const CaptchaFile = await this.getLoginCaptcha();
        const DataURL: string = 'data:image/jpeg;base64,' + CaptchaFile.toString('base64');
        const { text: captcha } = await superagent
            .post('https://luogu-captcha-bypass.piterator.com/predict/')
            .set('Content-Type', 'application/json')
            .send(DataURL);
        if (retry > 0) {
            if (await this.login(username, password, captcha)) return true;
            else return await this.autoLogin(username, password, retry - 1);
        }
        else return await this.login(username, password, captcha);
    }
}