import { Request, Response } from "express"
import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";


class AnswerController {

                                
    // https://localhost:3333/answers/0?u=09772378-62bb-4435-b253-1913022d3475
    // Route Params: answers e 0(value)
    // Query Params: "?" em diante


    async execute(request: Request, response: Response){
       const { value } = request.params;
       const { u } = request.query; 

       const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

       const surveyUser = await surveysUsersRepository.findOne({
           id: String(u),
       });
    
       if(!surveyUser) {
           throw new AppError("Survey User does not exist")

       }

       surveyUser.value = Number(value);

       await surveysUsersRepository.save(surveyUser);

       return response.json(surveyUser);
    }

}

export { AnswerController };