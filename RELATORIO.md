# Relatório do desafio de DEV - PTC 26.2

**Nome:** Giovanna Reis | **Branch:** `desafio/giovanna`

**Arquitetura:** `routes.ts` → Controller → Repository → Prisma → PostgreSQL, como no CRUD de usuários do template.

---

## O que foi feito

**Rotas obrigatórias:**

| Método | Rota | Sucesso |
|---|---|---|
| POST | `/plantas` | 201 |
| GET | `/plantas` (filtros `?luminosidade=` e `?petFriendly=`) | 200 |
| GET | `/plantas/:id` | 200 |
| PATCH | `/plantas/:id` | 200 |
| DELETE | `/plantas/:id` | 204 |
| POST | `/plantas/:id/venda` | 200 |
| GET | `/plantas/estoque/valor-total` | 200 |

**Regras:** todos os campos obrigatórios no cadastro; `preco > 0`; `estoque >= 0`; `regaACadaDias >= 1`; `luminosidade` só com os 3 valores do enum; dados inválidos retornam 400; id inexistente retorna 404; a venda nunca deixa o estoque negativo.

**Bônus feitos:** busca por nome sem diferenciar maiúsculas (`?nome=`), ordenação (`?ordem=preco` ou `?ordem=nome`) e `GET /plantas/esgotadas`.

**Ficou de fora:** o script de seed.

---

## Como foi feito

**Ordem:** li o CRUD de usuários, criei o model e a migration, escrevi repository, controller e rotas, depois filtros, venda, valor total e bônus. Testei cada caso no Thunder Client.

**Decisões e motivos:**

- **`validacao_de_campos` reaproveitada:** valida só os campos enviados, então serve para o cadastro e para o PATCH sem repetir regras.
- **`=== undefined` em vez de `!campo`:** porque `estoque: 0` e `petFriendly: false` são valores válidos.
- **Id validado** com `Number.isInteger(id) && id > 0` (400 se inválido).
- **Valor total:** busco só `preco` e `estoque` (`select`) e somo `preco × estoque` com um `for`.
- **Ordem das rotas:** `/plantas/estoque/valor-total` e `/plantas/esgotadas` vêm antes de `/plantas/:id`, senão o Express trataria o texto como id.
- Não houve decisões diferentes do enunciado.

### Vendas simultâneas

**Problema:** a venda lia o estoque e depois diminuía, em dois passos. Duas compras do último vaso podiam ler `estoque = 1`, passar na checagem e deixar o estoque em `-1`.

**Solução:** a checagem e a diminuição agora acontecem juntas, numa só operação no banco:

```typescript
prisma.planta.updateMany({
    where: { id: id, estoque: { gte: quantidade } },
    data: { estoque: { decrement: quantidade } },
});
```

O banco só altera a linha se ainda houver estoque suficiente. Se nenhuma linha for alterada (`count === 0`), outra compra levou o estoque primeiro e a API responde 400 sem mudar nada. Como o PostgreSQL executa atualizações concorrentes da mesma linha uma de cada vez, só uma das compras do último vaso é aceita.

---

## Principais dificuldades

O Node.js e o Yarn funcionaram sem problemas. A dificuldade foi o **Docker**:

1. Ao subir o projeto com `docker compose up -d --build`, o build falhou com o erro `read-only file system` ("sistema de arquivos somente leitura"). Na prática, o disco interno que o Docker usa travou e parou de aceitar gravação.
2. Ao tentar abrir o Docker de novo, ele mostrou o erro "There was a problem with WSL". O WSL é o recurso do Windows que o Docker usa por baixo. Percebi que o problema era do ambiente e não do meu código, porque a mensagem vinha do próprio Docker.
3. Resolvi reiniciando o WSL e o Docker e limpando os dados do Docker (o que apaga só imagens e containers locais, e não o meu código).
4. Mesmo depois, uma tentativa de build caiu perto do final com `error reading from server: EOF` (o Docker parou no meio do trabalho). Funcionou na tentativa seguinte, depois de fechar programas pesados para liberar memória.

---

## Uso de IA

Usei IA para:

- Entender o código de exemplo;
- Ajuda com erros;
- Perguntar comandos que eu não sabia;
- Estruturar o relatório;
- Revisar o código e ver se tinha erros;
- Pedir ajuda com algumas partes que eu não estava entendendo com fazer do código;
