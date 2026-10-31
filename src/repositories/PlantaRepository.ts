import { Luminosidade, Prisma } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data,
    });
};

export const findAllPlantas = async (filtros: { luminosidade?: Luminosidade; petFriendly?: boolean; nome?: string; ordem?: "preco" | "nome"; }) => {
    let orderBy: Prisma.PlantaOrderByWithRelationInput | undefined;

    if (filtros.ordem === "preco") {
        orderBy = { preco: "asc" };
    } else if (filtros.ordem === "nome") {
        orderBy = { nome: "asc" };
    }
    
    
    return await prisma.planta.findMany({
        where: {
            luminosidade: filtros.luminosidade,
            petFriendly: filtros.petFriendly,
            nome: { contains: filtros.nome, mode: "insensitive" },
        },

        orderBy: orderBy,
    });
};

export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({
        where: { id: id }
    });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({
        where: { id: id },
        data: data,
    });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({
        where: { id: id }
    });
};

export const venderPlanta = async (id: number, quantidade: number) => {
    return await prisma.planta.updateMany({
        where: { id: id, estoque:{ gte: quantidade } },
        data: { estoque: { decrement: quantidade } },
    });
};

export const findPreco_Estoque = async () => {
    return await prisma.planta.findMany({
        select: { preco: true, estoque: true },
    });
};

export const findPlantasEsgotadas = async () => {
    return await prisma.planta.findMany({
        where: { estoque: 0 },
    });
};