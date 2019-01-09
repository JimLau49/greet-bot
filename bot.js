// Load up the discord.js library
const Discord = require("discord.js");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./auth.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

const weather = require('weather-js')


client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity('use !');
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildMemberAdd" , function(member)
{
  member.guild.channels.find("name","general").send( "Greetings! " + member.toString());
});


client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot) return;
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  // Let's go with a few common example commands! Feel free to delete or change those.
  
  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  
  if(command === "say") {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    
    if(!message.member.roles.some(r=>["Administrator","Moderator"].includes(r.name)))
      return message.reply("Sorry, you don't have permissions to use this");

    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }

  if(command === "speak"){

    const sayMessage = args.join(" ")
    message.channel.send(sayMessage);
    return
  }
  
  if(command === "kick") {
    
    // only admins can kick
    if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.kickable) 
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");
    
    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No ban reason provided";
    
    
    await member.kick(reason)
      .catch(error => message.reply(`Sorry but, ${message.author} I couldn't kick the user because of : ${error}`));
    message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

  }
  
  if(command === "ban") {
    
    if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.bannable) 
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No reason provided";
    
    await member.ban(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }
  
  if(command === "delete") {
    // This command removes all messages from all users in the channel, up to 100.
    
	if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");

    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);
    
    // Ooooh nice, combined conditions. <3
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
    
    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({limit: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }


  if(command === "convertmiles")
  {
     
     var num = args.join('');
     var ans = num * 1.60934;
     message.channel.send("the conversion of " + num + " km is: " + ans + " miles");
  }


  if(command === "count")
  {
    var memberCount = client.users.size - 1 ;
    return message.reply("There are currently " + memberCount + " people in this server!")
  }

  if(command === "weather")
  {
    weather.find({search: args.join(" "), degreeType:'C'}, function(err,result) 
    {
      if(err)message.channel.send(err);  

      // Basic version
      //message.channel.send(JSON.stringify(result[0].current,null,2));  

      // Embeded version

      var current = result[0].current; // this variable stores the current part of the JSON output
      var location = result[0].location;

      const embed = new Discord.RichEmbed()
        .setDescription(`**{current.skytext}**`)
        .setAuthor(`Weather for ${current.observationpoint}`) 
        .setThumbnail(current.imageUrl)
        .setColor(0x00AE86)
        .addField('Timezone',`UTC${location.timezone}`,true)
        .addField('Degree Type',location.degreetype, true)
        .addField('Temperature',`${current.temperature} Degrees`, true)
        .addField('Feels like' , `${current.feelslike} Degrees`, true)
        .addField('Winds',current.winddisplay, true)
        .addField('Humidity',`${current.humidity}%`, true)

        message.channel.send({embed});



    });
  }

 
 // Outputting some embedded gifs where the url isn't displayed 
  if(command === "solominton" )
  {
   message.channel.send("Playing badminton by youself", {
    file: "https://i.imgur.com/SAtRsUO.gif" // Or replace with File path 
      });
  }  

  if(command === "miyanoseizure" )
  {
   message.channel.send("", {
    file: "https://cdn.discordapp.com/emojis/393601597349036042.gif" 
      });
  }  


  if(command === "miyano")
  {
    message.channel.send("", {
    file: "https://cdn.discordapp.com/emojis/394290798142816256.gif" 
      });
  }
  
  if(command === "dab")
  {
    message.channel.send("", {
    file: "https://i.imgur.com/NKo9LhU.gif?noredirect" 
      });
  }

  if(command === "iamnot")
  {
    let rolename = args.join('');
    message.member.removeRole(message.member.guild.roles.find("name",rolename));
    message.reply("Role permissions: " + "`" + rolename + "`" +" Removed");
  }

  if(command === "youare"){

    
    let member = message.mentions.members.first();
    if(!message.member.roles.some(r=>["Administrator"].includes(r.name)))
      return message.reply("Sorry, you don't have permissions to use this!");  

    if(!member)
      return message.reply("Please mention a valid member of this server");

    let rolename = args.slice(1).join(' ');
    member.addRole(rolename);
  }

  if(command === "iam")
  {
    let rolename = args.join('');

    if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) && (rolename === "Administrator" || rolename === "xd"  ))
      return message.reply("Sorry, you don't have permissions to use this!");  

    message.member.addRole(message.member.guild.roles.find("name",rolename));
    message.reply("Role permissions: " + "`" + rolename + "`" +" Granted");
  }
  if(command === "opgg")
  {
    let summonerName = args.join('');
    message.channel.send("http://na.op.gg/summoner/userName=" + summonerName);
  }

  if(command === "livegame")
  {  let summonerName = args.join('');
     message.channel.send("https://porofessor.gg/live/na/" + summonerName);
  }

 
 if(command === "uptime")
 {
  let totalSeconds = (client.uptime / 1000);
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;
  let roundedSeconds = Math.round(seconds * 100) / 100;
  let uptime = `${hours} hours, ${minutes} minutes and ${roundedSeconds} seconds`;

  message.channel.send("``` " + uptime + "```");
 } 

if(command === "spamping"){

	//TO PREVENT ABUSE
	// if(!message.member.roles.some(r=>["Administrator"].includes(r.name)))
	// {
	// 	message.channel.send("cannot spam user");
	// }
	var i;
	message.channel.send("spam ping recieved");
    const sayMessage = args.join(" ")
    for(i=0; i<=10 ; i++)
    {
    	message.channel.send(sayMessage);
    }
  }


});



client.login(config.token);