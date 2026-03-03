const http = require("http");
http.createServer((req, res) => res.end("Bot activo")).listen(process.env.PORT || 3000);
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  EmbedBuilder
} = require('discord.js');

const token = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// IDs IMPORTANTES — CAMBIA ESTOS
const CANAL_FICHAS = "1478425681078652958";
const ROL_VERIFICADO = "1478426368810422302";
const ROL_NO_VERIFICADO = "1478431881522581554";

// ROLES DE RAZAS
const RAZAS = {
  humano: "1478426630442451045",
  elfo: "1478426730883711050",
  enano: "1478426683278233713"
};

// ROLES DE TRABAJOS (CORRECTOS)
const TRABAJOS = {
  herrero: "1478427255792472217",
  alquimista: "1478427319550087229",
  agricultor: "1478427371840340009"
};

// ROLES DE CLASES
const CLASES = {
  tanque: "1478428188236316777",
  asesino: "1471982753493946670",
  sanador: "1478427990831661209"
};

client.once(Events.ClientReady, () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

// Cuando se usa /ficha
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ficha") {
    const menuRazas = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
      .setCustomId("select_raza")
      .setPlaceholder("Selecciona tu raza")
      .addOptions([
        { label: "Humano", value: "humano" },
        { label: "Elfo", value: "elfo" },
        { label: "Enano", value: "enano" }
      ])
    );

    await interaction.reply({
      content: "Selecciona tu **raza**:",
      components: [menuRazas],
      ephemeral: true
    });
  }
});

// Selección de raza
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "select_raza") {
    const raza = interaction.values[0];
    const rolId = RAZAS[raza];
    const rol = interaction.guild.roles.cache.get(rolId);

    if (rol) await interaction.member.roles.add(rol);

    const menuTrabajos = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
      .setCustomId("select_trabajo")
      .setPlaceholder("Selecciona tu trabajo")
      .addOptions([
        { label: "Herrero", value: "herrero" },
        { label: "Alquimista", value: "alquimista" },
        { label: "Agricultor", value: "agricultor" }
      ])
    );

    await interaction.update({
      content: `Has elegido **${raza}**. Ahora selecciona tu **trabajo**:`,
      components: [menuTrabajos]
    });
  }
});

// Selección de trabajo
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "select_trabajo") {
    const trabajo = interaction.values[0];
    const rolId = TRABAJOS[trabajo];
    const rol = interaction.guild.roles.cache.get(rolId);

    if (!rol) {
      console.log(`⚠️ El rol del trabajo "${trabajo}" no existe.`);
      return interaction.update({
        content: "Error: el rol del trabajo no existe.",
        components: []
      });
    }

    await interaction.member.roles.add(rol);

    const menuClases = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
      .setCustomId("select_clase")
      .setPlaceholder("Selecciona tu clase")
      .addOptions([
        { label: "Tanque", value: "tanque" },
        { label: "Asesino", value: "asesino" },
        { label: "Sanador", value: "sanador" }
      ])
    );

    await interaction.update({
      content: `Has elegido **${trabajo}**. Ahora selecciona tu **clase**:`,
      components: [menuClases]
    });
  }
});

// Selección de clase → abrir modal
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "select_clase") {
    const clase = interaction.values[0];
    const rolId = CLASES[clase];
    const rol = interaction.guild.roles.cache.get(rolId);

    if (rol) await interaction.member.roles.add(rol);

    const modal = new ModalBuilder()
    .setCustomId("modal_ficha")
    .setTitle("Completar ficha");

    const nombreRol = new TextInputBuilder()
    .setCustomId("nombre_rol")
    .setLabel("Nombre de tu personaje")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

    const usuarioMC = new TextInputBuilder()
    .setCustomId("usuario_mc")
    .setLabel("Usuario de Minecraft")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

    const historia = new TextInputBuilder()
    .setCustomId("historia")
    .setLabel("Historia inicial")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nombreRol),
                        new ActionRowBuilder().addComponents(usuarioMC),
                        new ActionRowBuilder().addComponents(historia)
    );

    await interaction.showModal(modal);
  }
});

// Procesar modal
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === "modal_ficha") {
    const nombre = interaction.fields.getTextInputValue("nombre_rol");
    const usuario = interaction.fields.getTextInputValue("usuario_mc");
    const historia = interaction.fields.getTextInputValue("historia");

    const embed = new EmbedBuilder()
    .setTitle(`Ficha de ${interaction.user.username}`)
    .addFields(
      { name: "Nombre del personaje", value: nombre },
      { name: "Usuario de Minecraft", value: usuario },
      { name: "Historia", value: historia }
    )
    .setColor("Blue")
    .setTimestamp();

    const canal = await client.channels.fetch(CANAL_FICHAS);
    await canal.send({ embeds: [embed] });

    // Añadir verificado
    const rolVerificado = interaction.guild.roles.cache.get(ROL_VERIFICADO);
    if (rolVerificado) await interaction.member.roles.add(rolVerificado);

    // Quitar no verificado
    const rolNoVerificado = interaction.guild.roles.cache.get(ROL_NO_VERIFICADO);
    if (rolNoVerificado) await interaction.member.roles.remove(rolNoVerificado);

    // Cambiar apodo
    try {
      await interaction.member.setNickname(`${nombre} [${usuario}]`);
    } catch (err) {
      console.log("⚠️ No se pudo cambiar el apodo:", err.message);
    }

    await interaction.reply({
      content: "¡Ficha enviada y rol **Verificado** asignado!",
      ephemeral: true
    });
  }
});

client.login(token);
