import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Transfer as TransferEvent
} from "../generated/Contract/Contract"
import {
  Approval,
  ApprovalForAll,
  OwnershipTransferred,
  Transfer,
  Token,
  TokenMetadata,
  User
} from "../generated/schema";

import { TokenMetadata as TokenMetadataTemplate } from "../generated/templates";
import { json, Bytes, dataSource, log } from "@graphprotocol/graph-ts";


const ipfsHash = "QmYmocsxt9z2tSUmH8qSEjtNQfvgUBfaR7dGeojhT68T2o";

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let token = Token.load(event.params.tokenId.toString())
  if (!token) {
    token = new Token(event.params.tokenId.toString())
    token.tokenID = event.params.tokenId
    
    token.tokenURI = "/" + event.params.tokenId.toString() + ".json";
    const ipfsHashUri = ipfsHash + token.tokenURI;
    //Isto cria um caminho aos metadados para um único NFT. Ele concatena o diretório com "/" + tokenId + ".json"

    token.ipfsURI = ipfsHashUri;
   
    TokenMetadataTemplate.create(ipfsHashUri);
    log.info("ipfsHashUri: {}", [ipfsHashUri]);
  }

  token.updatedAtTimestamp = event.block.timestamp
  token.owner = event.params.to.toHexString()
  token.save()

  let user = User.load(event.params.to.toHexString());
  if (!user) {
      user = new User(event.params.to.toHexString());
      user.save();
    }
}

export function handleMetadata(content: Bytes): void {
  let tokenMetadata = new TokenMetadata(dataSource.stringParam());
  // Create a new TokenMetadata entity and pass in the dataSource as its ID. This is the ipfsHashUri that we created in the handleTransfer function above.

  const value = json.fromBytes(content).toObject();
  // Create a value variable that will be used to store the json object that is passed in as the content parameter.
  if (value) {
      const image = value.get("image");
      const name = value.get("name");
      const description = value.get('description');
      // Assemblyscript needs to have nullchecks. If the value exists, then we can proceed with the creating an image, name, and attributes variable gathered from the json object.

      if (name && image && description) {
          tokenMetadata.name = name.toString();
          tokenMetadata.image = image.toString();
          tokenMetadata.description = description.toString();
      }
      tokenMetadata.save();
  }
}
