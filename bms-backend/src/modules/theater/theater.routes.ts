import express from 'express'
import * as theaterController from './theater.controller'
import { isVerifiedUser, isAdmin } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate'
import { TheaterSchema } from './theater.validation'


const router = express.Router()

router.post('/', isVerifiedUser, isAdmin, validate(TheaterSchema),theaterController.createTheater)
router.get('/', theaterController.getTheaters)

export default router