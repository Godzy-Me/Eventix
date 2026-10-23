import express from 'express'
import * as MovieController from './movie.controller'
import { MovieSchema } from './movie.validation'
import { isVerifiedUser, isAdmin } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate'

const router = express.Router()

router.post('/', isVerifiedUser, isAdmin, validate(MovieSchema), MovieController.createMovie)
router.get('/', MovieController.getMovies)
router.get('/recommended', MovieController.getTopRecommendedMovies)
router.get('/:id', MovieController.getMovieById)

export default router;