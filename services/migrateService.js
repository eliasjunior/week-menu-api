const { Category } = require('../models/category.model');

const categoryFile = require('../db_backup/categories')

function migration() {
    console.log('*** *** *** ** ** ')
    console.log('READING FILE ', categoryFile)

}