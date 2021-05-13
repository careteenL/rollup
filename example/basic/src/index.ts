import './index.css'
const userName: string = 'careteen'
const userAge: number = 25

console.log(userName)

// block scope
if(true) {
  var blockVariable = 25
}
console.log(blockVariable)

// rename variable
import { company1 } from './compay1'
import { company2 } from './compay2'
console.log(company1, company2)
