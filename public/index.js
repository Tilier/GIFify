function sendGifMessage() {
	$.ajax({ 
		url: "/api/sendgifmessage",
		data: {
			sender: "Tilier",
			receiver: "banana",
			gif: "idk",
			caption: "idkkkkkk"
		}, 
		type: "POST", // if you want to send data via the "data" property change this to "POST". This can be omitted otherwise 
		success: function(responseData) { 
			// empty mcmuffin
      	}, 
    	error: console.error 
    }); 

}