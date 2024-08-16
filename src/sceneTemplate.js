

class SceneTemplate {

	constructor() {

		this._destinationFolder = null;
	}
	// Pass in file with all scenes and parameters
	generateScenes(scenesFile, destinationFolder) {}
	// Pass in scene information to create file
	makeAScene(scene, destinationFolder) {
		if (destinationFolder) this._destinationFolder = destinationFolder;
		const SampleScene = {
			saga:"",
			author:"",
			book:"",
			
			part:0,
			chapter:0,

			title:"", 
			sceneNo:0,
			dayNo:0,
			pov:"",
			where:"",
			when:"",
			conflict:"",
			choice:"",
			consequnce:"",
		}
	}
	// Pass in scene information and file to apply them to

}
