const router = require('express').Router()

router.use('/api',require('./userRoutes'))
router.use('/api',require('./postRoutes'))
router.use(require('./funRoutes.js'))

module.exports = router