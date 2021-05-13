import './index.css'
const userName: string = 'careteen'
const userAge: number = 25

console.log(userName)

// block scope
if(true) {
  var blockVariable = 25
}
console.log(blockVariable)
