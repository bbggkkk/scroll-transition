(function(){

    class ScrollBody {
        constructor(ele){
            this.init(ele);

            this.setScrollBody(0);
            this.scrollTarget.addEventListener('scroll',this.setScrollBody.bind(this));
            const obs = new ResizeObserver(() => { this.init.bind(this)(ele); this.setScrollBody(0); });
            obs.observe(this.scrollBody);
        }    

        init(ele){
            // const scrollBody   = document.querySelector('[data-scroll-transition]');  //트랜지션 스크롤 이벤트 대상
            this.scrollBody    = ele;
            this.scrollItem    = document.querySelectorAll(ele.getAttribute('data-scroll-target'));         //트랜지션 대상
            this.scrollTarget  = this.isEval(this.scrollBody.getAttribute('data-scroll-transition'));

            //init
            //초기값 세팅
            this.scrollStart = this.scrollBody.getAttribute('data-scroll-start') ? +this.scrollBody.getAttribute('data-scroll-start') : 0;
            this.scrollEnd   = this.scrollBody.getAttribute('data-scroll-end')   ? +this.scrollBody.getAttribute('data-scroll-end')   : this.scrollHeight - this.offsetHeight;
            this.scrollDiff  = this.scrollEnd - this.scrollStart;

            this.prevScroll  = undefined;

            for(let i=0; i<this.scrollItem.length; i++){
                const ele = this.scrollItem[i];
                const itemParam = ele.scrollItem = {
                    before          : this.parseCSS(ele.getAttribute('data-before')),
                    after           : this.parseCSS(ele.getAttribute('data-after')),
                    placeholder     : this.replaceNumberList(this.parseCSS(ele.getAttribute('data-after'))),
                };
                itemParam.numBefore = this.matchNumList(itemParam.before);
                itemParam.numAfter  = this.matchNumList(itemParam.after);
                itemParam.numDiff   = Object.keys(itemParam.numAfter).reduce((acc,item) => {
                    acc[item] = itemParam.numAfter[item].map(($item, idx) => $item - itemParam.numBefore[item][idx]);
                    return acc;
                },{});

                ele.style.willChange = 'scroll-position';
            }
        }

        isEval(string){
            if(/^\$\{.*\}$/.test(string)){
                return new Function('return '+string.match(/\$\{(.*)\}/)[1])();
            }else{
                return string.replace(/\$\{(.*)\}/g,(match,p1) => {
                    return new Function('return '+p1)();
                });
            }
        }
    
    
        setScrollBody(e){
            requestAnimationFrame(() => {
                let Y = this.scrollTarget.scrollY;
    
                if(Y < this.scrollStart)    Y = this.scrollStart;
                if(Y > this.scrollEnd)      Y = this.scrollEnd;
    
                Y = Y - this.scrollStart;

                if(this.prevScroll === Y) return;
                
                for(let i=0; i<this.scrollItem.length; i++){
                    const ele = this.scrollItem[i];
                    const itemParam = ele.scrollItem;
    
                    Object.keys(itemParam.placeholder).forEach((item) => {

                        // console.log(ele,item,itemParam);
                        ele.style[item] = itemParam.placeholder[item].replace(/\{(\d)\}/g,(match,p1) => {    
                            return (itemParam.numBefore[item][p1] + ( itemParam.numDiff[item][p1] * Y / this.scrollDiff )).toFixed(2);
                        });
                    });
                }

                this.prevScroll = Y;
    
            });
        }
        
        matchNumList(obj){
            const result = Object.keys(obj).reduce((acc,item) => {
                acc[item] = this.matchNumber(obj[item]);
                return acc;
            }, {});
            return result;
        }
    
        matchNumber(string){
            const result = string.match(/\-?\d{0,}\.?\d+/g).map(item => +item);
            return result;
        }
    
        replaceNumberList(obj){
            const result = Object.entries(obj).reduce((acc,item) => {
                const [key,value] = this.replaceNumber(item);
                acc[key] = value;
                return acc;
            },{});
            return result;
        }
        replaceNumber(obj){
            const [key,value] = obj;
            let i = -1;
            const result = value.replace(/\-?\d?\.?\d+/g,(match,p,idx) => {
                i++;
                return `{${i}}`;
            });
    
            return [key,result];
        }
    
        parseCSS($css){
            const css = $css.replace(/;$/,"");
            const cssJS     = css.replace(/\n|(;)$/g,"")
                .split(";")
                .map(item => item.replace(/\-([a-z])/,(match,p1)=>p1.toUpperCase()))
                .reduce( (acc,item) => {
                    acc[item.split(":")[0].trim()] = this.isEval(item.split(":")[1].replace(/ +/g," ").trim());
                    return acc;
                },{});
            return cssJS;
        }
    }

    class ScrollSnap {
        constructor({
            ele,
            start,
            end
        }){
            this.ele = ele.getAttribute('data-scroll-snap') === '${window}' ? window : ele;
            this.start = start;
            this.end   = end;
            this.diff  = end - start;
            this.half  = Math.round(this.diff/2);

            this.init();
        }

        init(){
            this.ele.addEventListener('scroll',this.scroll.bind(this));

        }

        scroll(e){
            clearTimeout(this.isScroll);
            this.isScroll = setTimeout(() => {
                if(this.ele.scrollY < this.half && this.ele.scrollY > this.start){
                    this.ele.scrollTo({
                        top:this.start,
                        behavior:'smooth'
                    });
                }else if (this.ele.scrollY > this.half && this.ele.scrollY < this.end){
                    this.ele.scrollTo({
                        top:this.end,
                        behavior:'smooth'
                    })
                }
            },500);
        }
    }



    const bodys = document.querySelectorAll('[data-scroll-transition]');
    [...bodys].forEach(item => { new ScrollBody(item); } );

    const snap = document.querySelector('[data-scroll-snap]');
    const snapStart = snap.getAttribute('data-scroll-snap-start');
    const snapEnd = snap.getAttribute('data-scroll-snap-end');
    const snapBody = new ScrollSnap({ele : snap, start : snapStart, end : snapEnd});
    

})();