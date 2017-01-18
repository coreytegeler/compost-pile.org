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

//http://blog.andrewray.me/how-to-clone-a-nested-array-in-javascript/
function arrayClone( arr ) {
  var i, copy;
  if( Array.isArray( arr ) ) {
    copy = arr.slice( 0 );
    for( i = 0; i < copy.length; i++ ) {
        copy[ i ] = arrayClone( copy[ i ] );
    }
    return copy;
  } else if( typeof arr === 'object' ) {
      throw 'Cannot clone array containing an object!';
  } else {
      return arr;
  }
}