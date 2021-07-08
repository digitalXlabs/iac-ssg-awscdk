import { machineName, niceMachineName, camelCase, camelCaseUpper } from '../../src/strings/index';


test('test machine name', () => {
  expect(machineName('I am moth')).toMatch('i_am_moth');
  expect(machineName('I. am.moth')).not.toMatch('i_am_moth');
})

test('test nice machine name', () => {
  expect(niceMachineName('I am moth')).toMatch('i_am_moth');
  expect(niceMachineName('I. am.moth')).toMatch('i_am_moth');
  expect(niceMachineName('I. am .moth')).toMatch('i_am_moth');
  expect(niceMachineName('I.am.moth')).toMatch('i_am_moth');
  expect(niceMachineName('I.am.moth', '-')).toMatch('i-am-moth');
})

test('test camel case', () => {
  expect(camelCase('I am a camel')).toMatch('iAmACamel')
  expect(camelCase('I am a-camel')).not.toMatch('iAmACamel')
  expect(camelCase('I adm a camel')).not.toMatch('iAmACamel')
})

test('test upper camel case', () => {
  expect(camelCaseUpper('I am a camel')).toMatch('IAmACamel')
  expect(camelCaseUpper('I am sa camel')).not.toMatch('IAmACamel')
})