import { Request, Response } from "express";
import { resolve } from 'path';
import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { SurveysRepository } from "../repositories/SurveysRepository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import SendMailService from "../services/SendMailService";


class SendMailController {

    async execute(request: Request, response: Response){
        const { email, survey_id } = request.body;

        const usersRepository = getCustomRepository(UsersRepository);
        const surveysRepository = getCustomRepository(SurveysRepository);
        const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);
        
        const user = await usersRepository.findOne({
            email,
        });

        if(!user) {
            throw new AppError("User does not exist!");
        }

        const survey = await surveysRepository.findOne({id: survey_id});

        if(!survey) {
            throw new AppError("Survey does not exist!");
        }
        
        
        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");
        
        
        /* Tabela pivot === model (SurveyUser.ts), ela serve para guardar os id's de relação
         se você quer que retorne os repositorios que ela se relaciona teria que passar no find
         mas agora sem esse where value: null */
        const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
            where: {user_id: user.id, value: null},
            relations: ["user", "survey"],
        });
        
        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            id: "",
            link: process.env.URL_MAIL,
        };


        if(surveyUserAlreadyExists) {
            variables.id = surveyUserAlreadyExists.id ;
            await SendMailService.execute(email, survey.title, variables, npsPath);
            return response.json(surveyUserAlreadyExists);
        }

        // Salvar as informacoes na tabela surveyUser
        const surveyUser = surveysUsersRepository.create({
            user_id: user.id,
            survey_id,
        });
        
        await surveysUsersRepository.save(surveyUser);
        
        
        // Enviar o e-mail para o usuario

        variables.id = surveyUser.id ;

        await SendMailService.execute(email, survey.title, variables, npsPath);

        return response.json(surveyUser);
    }
}

export { SendMailController };