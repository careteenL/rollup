// tree-shaking
import { name, age } from './userinfo'
function say() {
  console.log('hi ', name)
}
say()

// TODO: obj.home
// var obj = {
//   home: 'zy',
// }
// name += obj.home

// block scope
if(true) {
  var blockVariable = 25
}
console.log(blockVariable)
