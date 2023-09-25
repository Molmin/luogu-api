import { BasicService, UserAgent } from './lib'

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
}