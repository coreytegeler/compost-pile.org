function getDaysInMonth(m, y) {
   return /8|3|5|10/.test(--m)?30:m==1?(!(y%4)&&y%100)||!(y%400)?29:28:31;
}

function h() {
	return window.innerHeight;
}

function w() {
	return window.innerWidth;
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}