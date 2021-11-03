const { response } = require('express')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

let customers = []

const app = express()
app.use(express.json())

function verifyIfExistsAccountCPF(req, res, next){
    const {cpf} = req.headers
    const customer = customers?.find(customer => customer.cpf == cpf)
    if(!customer){
        return res.status(400).json({error: 'Not Found'})
    }
    req.customer = customer
    return next()
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation)=>{
        if(operation.type == 'credit'){
            return acc + operation.amount
        }else{
            return acc - operation.amount
        }


    },0)
    return balance
}

app.post('/account', (req, res)=>{
    const {cpf, name} = req.body
    let customerAlreadyExists = customers.some(customer => customer.cpf === cpf)
    const id = uuidv4();
    if(customerAlreadyExists){
        return res.status(401).send({error: "Already Exists"})
    }
    customers.push({
        cpf,name, id, statement:[]
    })
    return res.status(201).send()
})
// app.use(verifyIfExistsAccountCPF)
app.get('/statement', verifyIfExistsAccountCPF,(req,res)=>{
    const {customer} = req
    return res.json(customer?.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (req, res)=>{
    const {customer} = req
    const {desc, amount} = req.body
    const statementOperation = {
        desc, amount, createdAt:new Date(), type:'credit'
    }

    customer.statement.push(statementOperation)
    return res.send(201).send()

})

app.post('/withdraw', verifyIfExistsAccountCPF, (req, res)=>{
    const {amount} = req.body
    const {customer} = req

    const balance = getBalance(customer.statement)

    if(balance < amount){
        return res.status(400).send({error: 'Insuficient Funds'})
    }

    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: 'debit',
    }
    customer.statement.push(statementOperation)

    return res.status(201).send()

})

app.get('/statement/date', verifyIfExistsAccountCPF,(req,res)=>{
    const {customer} = req
    const {date} = req.query

    const dateFormat = new Date(date + " 00:00")

    const statement = customer?.statement?.filter((statement)=> statement.createdAt.toDateString() == new Date(dateFormat).toDateString())

    return res.json(statement)
})

app.put('/account', verifyIfExistsAccountCPF, (req, res)=>{
    const {name} = req.body
    const {customer} = req

    customer.name = name

    return res.status(201).send()
})

app.get('/account', verifyIfExistsAccountCPF, (req, res)=>{
    const {customer} = req
    return res.status(201).send(customer)
})

app.delete("/account", verifyIfExistsAccountCPF, (req, res)=>{
    const {customer} = req

    customers.splice(customer, 1)

    return res.status(200).send(customers)
})

app.get('/balance', verifyIfExistsAccountCPF, (req, res)=>{
    const {customer} = req

    const balance = getBalance(customer.statement)
    return res.json(balance)
})

app.listen(3333)