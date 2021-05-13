// tree-shaking
// import { name, age } from './userinfo'
// function say() {
//   console.log('hi ', name)
// }
// say()

// TODO: obj.home
// var obj = {
//   home: 'zy',
// }
// name += obj.home

// block scope
// if(true) {
//   var blockVariable = 25
// }
// console.log(blockVariable)

// entry tree-shaking
// var company = 'sohu focus'
// var companyAge = 23
// console.log(company)

// rename variable
import { company1 } from './compay1'
import { company2 } from './compay2'
console.log(company1, company2)
