import { Request, Response } from "express";
import * as PlantaRepository from "@repositories/PlantaRepository";
import { Luminosidade } from "@prisma/client"

// O controller recebe a requisição, valida os dados, chama o repository
// e decide qual status HTTP e qual corpo devolver.

const validacao_de_campos = (dados: any) => {
    const {nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

    if(nome !== undefined && (typeof nome !== "string" || nome.trim() === "")) {
        return "nome não pode ser um texto vazio."
    }

    if (especie !== undefined && (typeof especie !== "string" || especie.trim() === "")) {
    return "especie não pode ser texto vazio.";
  }

  if (preco !== undefined && !(Number.isInteger(preco) && preco > 0)) {
    return "preco deve ser um inteiro maior que zero (em centavos).";
  }

  if (estoque !== undefined && !(Number.isInteger(estoque) && estoque >= 0)) {
    return "estoque deve ser um inteiro maior ou igual a zero.";
  }

  if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade)) {
    return "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.";
  }

  if (petFriendly !== undefined && typeof petFriendly !== "boolean") {
    return "petFriendly deve ser true ou false.";
  }

  if (regaACadaDias !== undefined && !(Number.isInteger(regaACadaDias) && regaACadaDias >= 1)) {
    return "regaACadaDias deve ser um inteiro maior ou igual a 1.";
  }

  return null;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    // 400 Bad Request: o cliente mandou dados incompletos
    if (nome === undefined ||
        especie === undefined ||
        preco === undefined ||
        luminosidade === undefined ||
        petFriendly === undefined ||
        regaACadaDias === undefined ||
        estoque === undefined
    ) {
      return res.status(400).json({
        message: "Preencha nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias.",
      });
    }

    const erro = validacao_de_campos(req.body);
    if (erro) {
        return res.status(400).json({ message: erro});
    }

    const planta = await PlantaRepository.createPlanta({
        nome: nome, 
        especie: especie, 
        preco: preco, 
        estoque: estoque, 
        luminosidade: luminosidade, 
        petFriendly: petFriendly, 
        regaACadaDias: regaACadaDias

    });

    // 201 Created: algo novo foi criado
    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    // 500 Internal Server Error: o problema foi nosso, não do cliente
    return res.status(500).json({ message: "Erro ao criar planta." });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {

    const { luminosidade, petFriendly } = req.query;

    if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade as Luminosidade)) {
        return res.status(400).json({ message: "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO."});
    }

    let petFriendlyFiltro;

    if (petFriendly === "true") {
        petFriendlyFiltro = true;
    } else if (petFriendly === "false") {
        petFriendlyFiltro = false;
    }else if (petFriendly !== undefined) {
        return res.status(400).json({ message: "petFriendly deve ser true ou false."});
    }

    const plantas = await PlantaRepository.findAllPlantas({ luminosidade: luminosidade as Luminosidade | undefined, petFriendly: petFriendlyFiltro, });

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    // O id chega da URL como texto, então convertemos para número
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "id deve ser um número inteiro maior que zero."})
    }

    const planta = await PlantaRepository.findPlantaById(id);

    // 404 Not Found: o id não existe
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "id deve ser um número inteiro maior que zero."})
    }

    const erro = validacao_de_campos(req.body);
    if (erro) {
        return res.status(400). json({ message: erro});
    }

    // Antes de editar, garantimos que o usuário existe
    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrado." });
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    // PATCH = atualização parcial: campos não enviados (undefined) não são alterados
    const updatedPlanta = await PlantaRepository.updatePlanta(id, {
      nome: nome, 
        especie: especie, 
        preco: preco, 
        estoque: estoque, 
        luminosidade: luminosidade, 
        petFriendly: petFriendly, 
        regaACadaDias: regaACadaDias,
    });

    return res.status(200).json(updatedPlanta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "id deve ser um número inteiro maior que zero."})
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantaRepository.deletePlanta(id);

    // 204 No Content: deu certo e não há nada para devolver
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};
