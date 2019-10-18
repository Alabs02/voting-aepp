const contractSource = `
    contract Election = 

    record candidate = 
    { creatorAddress   : address, 
        url              : string, 
        name             : string, 
        voteCounter      : int  }

    record state = 
    { candidates : map(int, candidate), 
        candidatesLength : int  }

    entrypoint init() = 
    { candidates = {}, 
        candidatesLength = 0 }

    entrypoint getCandidate(index : int ) : candidate = 
    switch( Map.lookup(index, state.candidates ))
        None    => abort("There is no candidate with this index registered.")
        Some(x) => x
    
    stateful entrypoint registerCandidate( url' : string, name' : string ) =
    let candidate = { creatorAddress = Call.caller, url = url', name = name', voteCounter = 0 }
    let index = getCandidatesLength() + 1
    put( state { candidates[index] = candidate, candidatesLength = index })
    
    
    entrypoint getCandidatesLength() : int = 
    state.candidatesLength
    
    stateful entrypoint voteCandidate( index : int ) = 
    let candidate = getCandidate(index)
    Chain.spend(candidate.creatorAddress, Call.value)
    let updatedVoteCounter = candidate.voteCounter + Call.value
    let updatedCandidates = state.candidates{ [index].voteCounter = updatedVoteCounter }
    put(state { candidates = updatedCandidates })
`;
const contractAddress =  "ct_25odzQJqdX5BcmqxwpBkg8tzGBqkecxUyP3sVWTJ3vRcfvrok1";
var client = null;
var candidateArray = [];
var candidatesLength = 0;


function renderCandidates() {
    candidateArray = candidateArray.sort(function(a,b){return b.votes-a.votes})
  var template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {candidateArray});
  $('#candidateBody').html(rendered);
}

window.addEventListener('load', async () => {

    client = await Ae.Aepp();

    const contract = await client.getContractInstance(contractSource, {contractAddress});
    const calledGet = await contract.call('getCandidatesLength', [], {callStatic: true}).catch(e => console.error(e));
    console.log('calledGet', calledGet);
  
    const decodedGet = await calledGet.decode().catch(e => console.error(e));
    console.log('decodedGet', decodedGet);

  renderCandidates();
});

jQuery('#candidateBody').on("click", ".vote-btn", async function(event){
    const dataIndex = event.target.id;
    const foundIndex = candidateArray.findIndex(candidate => candidate.index == dataIndex);
    const value = $(".amount")[foundIndex].value;
    candidateArray[foundIndex].votes += parseInt(value, 10);
    renderCandidates();
});

$('.reg-btn').click(async function(){
    var name = ($('#icon_prefix').val()),
        url = ($('.reg_url').val());

    candidateArray.push({
        creatorName: name,
        candidateUrl: url,
        index: candidateArray.length+1,
        votes: 0
        })
        renderCandidates();
    });

   
  
