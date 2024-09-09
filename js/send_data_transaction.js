import { dag4 } from '@stardust-collective/dag4';
import jsSha256 from 'js-sha256';
import axios from 'axios';
import { Buffer } from 'buffer';

import { parseFormData } from './parseForm';

// Async function to handle the transaction
async function sendTransaction(message, proof) {
	const body = {
        value: {
            ...message
        },
        proofs: [
            proof
        ]
    };
    try {
    	const metagraphL1DataUrl="http://127.0.0.1:9400";
        console.log( `Transaction body: ${JSON.stringify( body )}` );
        const response = await axios.post( `${metagraphL1DataUrl}/data`, body );
        console.log( `Response: ${JSON.stringify( response.data )}` );
    } catch( e ) {
        console.log( 'Error sending transaction', e.message );
    }
    return;
}

async function generateProof(message, walletPrivateKey, account) {
	const encodedMessage = Buffer.from(JSON.stringify(message)).toString('base64')
    const signature = await dag4.keyStore.dataSign( walletPrivateKey, encodedMessage );

    const publicKey = account.publicKey;
    const uncompressedPublicKey =
    publicKey.length === 128 ? '04' + publicKey : publicKey;

    return {
        id: uncompressedPublicKey.substring( 2 ),
        signature
    };
}

function buildMessageBody(data, account) {
	let proposalType = data['proposal-type'];
	let setProposalType = (proposalType == "0") ? "Governance Changes" : proposalType;
	let defaultVotingType = 'Multiple Choice'

    const poll = {
        CreatePoll: {
            name: 					data['Proposal-Title'],
            content: 				data['Proposal-Description'], 
            owner: 					account.address.toString(),
            proposalType: 			setProposalType,
            pollType: 				defaultVotingType, // default  
            pollOptions: 			data['Quorum-Threshold'].split(','),
            startSnapshotOrdinal: 	parseInt(data['start-snapshot-ordinal']), //start_snapshot, you should replace
            endSnapshotOrdinal: 	parseInt(data['end-snapshot-ordinal']) //end_snapshot, you should replace
        }
    }

    // console.log('startSnapshotOrdinal type:', typeof createPoll.CreatePoll.startSnapshotOrdinal); => number

    return poll; 
}

async function validateFormInputs(data) {
  const numberInput1 = data['start-snapshot-ordinal'];
  const numberInput2 = data['end-snapshot-ordinal'];
  const errorMessage = document.getElementById('snapshot-ordinal-error-message');
  
  let isValid = true;

  // Validate first input
  if (numberInput1 <= 0 || isNaN(numberInput1)) {
    isValid = false;
    errorMessage.textContent = "Please provide a positive number for the Start Snapshot Ordinal"; 
  }

  // Validate second input
  if (numberInput2 <= 0 || isNaN(numberInput2)) {
    isValid = false;
    errorMessage.textContent = "Please provide a positive number for the End Snapshot Ordinal"; 
  }

  // Validate Snapshot Ordinal Ordering 
  if (numberInput1 >= numberInput2) {
  	isValid = false; 
  	errorMessage.textContent = "Please ensure the Start Snapshot Ordinal comes before the End Snapshot Ordinal"; 
  }

  // Validate Snapshot Ordinal Time 
  const latestSnapshotOrdinal = await fetchLatestSnapshotOrdinal(); 
  if (latestSnapshotOrdinal) {
  	const snapshotOrdinalCap = latestSnapshotOrdinal + 10;
  	if (snapshotOrdinalCap > numberInput2) {
  		isValid = false; 
  		errorMessage.textContent = `Please enter an End Snapshot Ordinal beyond the following count: ${snapshotOrdinalCap}`; 
  	}
  } else {
  	isValid = false; 
  	errorMessage.textContent = "Error: Incomplete Validation on Form Inputs. Please ensure the Metagraph server is configured correctly."; 
    // alert("Error: Incomplete Validation on Form Inputs. Please ensure the Metagraph server is configured correctly.");
  }

  if (!isValid) {
    errorMessage.style.display = 'block';  // Show error message
    return false;  // Return false if validation fails
  } else {
    errorMessage.style.display = 'none';  // Hide error message
    return true;  // Return true if validation passes
  }
}

async function fetchLatestSnapshotOrdinal() {
	const url = 'http://localhost:9200/snapshots/latest/combined'; 
	try {
    	const response = await axios.get(url); // Make a GET request
    	const data = response.data; 
    	const latestOrdinal = data[0].value.ordinal; 

    	return latestOrdinal; 
  } catch (error) {
    	console.error('Error fetching latest snapshot ordinal:', error); // Handle errors
    	return null;
  }
}

const form = document.getElementById('wf-form-Create-Edit-Proposal'); 

// Add an event listener for form submit
form.addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevents form submission and page reload
    
    // Parse the form inputs
	const formData = new FormData(event.target);

    // Call parseFormData from parseForm.js
    const parsedData = parseFormData(formData);
 
    const formIsValid = await validateFormInputs(parsedData);
    if (!formIsValid) {
        console.error("Oops! Something went wrong while submitting the form.");
		return; 
	}

	console.log("Form was validated successfully"); 
    alert("Thank you! Your submission has been received!");

    // generate wallet 
    const privateKey = dag4.keyStore.generatePrivateKey();
    const account = dag4.createAccount();
    account.loginPrivateKey(privateKey);
    account.connect({
    	networkVersion: "2.0",
    	l0Url: "http://127.0.0.1:9000",
    	testnet: true,
    });
 
    // // build the message body 
    const message = buildMessageBody(parsedData, account);
    const proof = await generateProof( message, privateKey, account );
       
    try {
        // Call the sendTransaction function with parsed values
        const response = await sendTransaction(message, proof);
        console.log('Transaction successful:', response);
    } catch (error) {
        event.preventDefault(); // Prevent form from submitting traditionally
        console.error('Transaction failed:', error);
        alert('Error sending transaction');
    }
});
