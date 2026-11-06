/** Phones that can't be asked for much, judged by their memory and their processor. iPhones and iPads tell Safari they have
    very few cores whatever is really inside them, so for them the count means nothing and they are not held back by it. */
const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const modest = (!apple && (navigator.hardwareConcurrency || 8) <= 4) || (navigator.deviceMemory || 8) <= 3;
