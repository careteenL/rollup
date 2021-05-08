import { clone } from 'lodash'
import { name, age } from './userinfo'

console.log(name, clone)

const sum = (a, b) => {
  return a + b
}

const result = sum(1, 2)
console.log(result)
