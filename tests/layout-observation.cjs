'use strict';
const assert = require('node:assert/strict');

// Runs against the actual Hexo-generated site in the UI regression browser.
module.exports = async ({ ev, nav, size, pause, appearance, screenshot }) => {
    const failures = [];
    const check = (condition, description, value) => {
        if (!condition) failures.push({ description, value });
    };
    for (const mode of ['night', 'day']) {
        for (const width of [1280, 1366, 1440]) {
            await size(width, 900); await nav('/404.html'); await appearance(mode);
            for (let i = 0; i < 2; i++) {
                await ev("document.querySelector('#footer-left-sidebar-icon').click()"); await pause(500);
                const geometry = await ev("(()=>{const c=document.querySelector('#page404-canvas'),r=c.getBoundingClientRect(),p=c.parentElement.getBoundingClientRect();return {parent:p.width,canvas:r.width,bitmap:c.width/devicePixelRatio,offset:r.x+r.width/2-p.x-p.width/2}})()");
                check(Math.abs(geometry.parent - geometry.canvas) < 1 && Math.abs(geometry.parent - geometry.bitmap) < 1 && Math.abs(geometry.offset) < 1, `404 container ${mode}/${width}/${i}`, geometry);
                if (width === 1280 && i === 0) await screenshot(`404-sidebar-collapsed-${mode}`);
            }
        }
    }
    for (const width of [768, 800, 900]) {
        await size(1440, 900); await nav('/');
        await ev("document.querySelector('#header-right-title .header-right-title-text').textContent='A longer blog title for layout auditing'");
        await size(width, 900);
        for (let i = 0; i < 2; i++) {
            await ev("document.querySelector('#header-left-menu-icon').click()"); await pause(350);
            const read = () => ev("['#header-right-title','#header-right-time'].map(s=>document.querySelector(s).classList.contains('hidden'))");
            const actual = await read();
            // A viewport recalculation must not change a supposedly settled layout.
            await ev("window.dispatchEvent(new Event('resize'))"); await pause(100);
            const recalculated = await read();
            check(JSON.stringify(actual) === JSON.stringify(recalculated), `Header menu ${width}/${i}`, { actual, recalculated });
        }
    }
    await size(1440, 900); await nav('/review/');
    await ev("(()=>{const b=document.createElement('div');b.id='late-layout-content';b.style.height='1600px';document.querySelector('#content').appendChild(b);document.querySelector('#content-wrapper').style.overflowAnchor='none'})()");
    await pause(100);
    await ev("document.querySelector('#content-wrapper').scrollTop=500"); await pause(150);
    const readProgress = () => ev("(()=>{const c=document.querySelector('#content-wrapper');return {shown:Number(document.querySelector('.sidebar-toc-progress-num').textContent),expected:Math.round(c.scrollTop/(c.scrollHeight-c.clientHeight)*100)}})()");
    for (const height of [3600, 1800]) {
        await ev(`document.querySelector('#late-layout-content').style.height='${height}px'`); await pause(250);
        const progress = await readProgress();
        check(progress.shown === progress.expected, `Late content height ${height}`, progress);
    }
    await size(1440, 700);
    const progress = await readProgress();
    check(progress.shown === progress.expected, 'Viewport height changes without scrolling', progress);
    await ev("document.querySelector('#content-wrapper').scrollTop=800");
    for (const height of [100, 60]) {
        await ev(`document.querySelector('#footer-wrapper').style.height='${height}px'`); await pause(250);
        const footer = await ev("(()=>{const f=document.querySelector('#footer-wrapper'),b=document.querySelector('#return-top');return {height:f.offsetHeight,tracked:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dt-footer-height')),clear:b.getBoundingClientRect().bottom<=f.getBoundingClientRect().top}})()");
        check(footer.tracked === footer.height && footer.clear, `Footer height ${height}`, footer);
    }
    await ev("document.querySelector('#footer-wrapper').style.removeProperty('height')");
    assert.deepEqual(failures, [], 'Container-dependent components must update without viewport or scroll glue events');
    const scheduling = await ev(`(async()=>{
        const {observeLayout}=await import('/js/utils/layoutObserver.js');
        const wait=()=>new Promise(resolve=>setTimeout(resolve,100));
        const a=document.createElement('div'),b=document.createElement('div');
        for(const e of [a,b]) {e.style.cssText='position:fixed;top:0;left:0;width:100px;height:10px;visibility:hidden';document.body.appendChild(e)}
        let calls=0,otherCalls=0;
        const first=observeLayout([a,a,null],()=>calls++,{viewport:false});
        const second=observeLayout([b],()=>otherCalls++,{viewport:false});
        await wait(); calls=0;otherCalls=0;
        first.request();first.request();first.request();await wait();
        const coalesced=calls;
        calls=0;a.style.width='150px';await wait();
        const resized=calls,isolated=otherCalls;
        await wait();const settled=calls;
        first.request();first.disconnect();first.disconnect();a.style.width='200px';await wait();
        const disconnected=calls;
        second.disconnect();a.remove();b.remove();
        return {coalesced,resized,isolated,settled,disconnected};
    })()`);
    assert.deepEqual(scheduling, { coalesced: 1, resized: 1, isolated: 0, settled: 1, disconnected: 1 }, 'Shared observation must coalesce, isolate and unsubscribe without loops');
    console.log('PASS: 404 parent sizing, header menu capacity, late content and viewport-height progress.');
};
