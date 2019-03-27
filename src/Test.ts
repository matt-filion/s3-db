import { collection, id, Collection, ReferenceList } from "./model/Collection";
import { BasicObject } from "./utils/Metadata";
import * as uuid4 from 'uuid/v4';
import { S3Metadata } from "./aws/S3";

@collection('user')
class User {
    @id((object: BasicObject) => `users/${uuid4()}`)
    public id?: string;
    public name?: string;
    public age?: number;
    [prop: string]: any;
}

const users: Collection<User> = new Collection(User);

users
    .save({name:'matt',age:12})
    .then( (metadata:S3Metadata) => console.log("Delete ",metadata) )

    // .head('users/2fac4126-f228-403e-a9c5-1eb32cbfa809')
    // .then( (metadata:S3Metadata) => console.log("Delete ",metadata) )