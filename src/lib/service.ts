import superagent from 'superagent'

export class BasicService {
    public cookie: string[] = [];
    public header: Record<string, any> = {};
    public postHeader: Record<string, any> = {};

    constructor(
        public endPoint: string,
        public log: (...contents: any[]) => void,
    ) { }

    get(url: string) {
        url = new URL(url, this.endPoint).toString();
        return superagent.get(url).set('Cookie', this.cookie).set(this.header);
    }
    post(url: string) {
        url = new URL(url, this.endPoint).toString();
        const request = superagent.post(url).set('Cookie', this.cookie);
        return request.set(this.header).set(this.postHeader);
    }
}