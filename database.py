import json
from pymongo import MongoClient
import pandas as pd

class TwinkleStepDatabase:
    def __init__(self, db_uri="mongodb://localhost:27017/", db_name="Twinkle_Step", collection_name="users"):
        """ Initialize the database connection and collection """
        self.client = MongoClient(db_uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]

    def insert_data(self, json_file="db.json"):
        """
        Inserts data from the given JSON file into the MongoDB collection.
        
        Args:
            json_file (str): Path to the JSON file containing user data.
        
        Returns:
            None
        """
        with open(json_file, "r", encoding="utf-8") as file:
            data = json.load(file)
        
        if "users" in data and isinstance(data["users"], list):
            user_data = data["users"]
            self.collection.insert_many(user_data)
            print("Data inserted successfully!")
        else:
            print("Error: The JSON file does not contain a valid list of users.")

    def get_all_usernames(self):
        """
        Retrieves a list of all usernames in the collection.
        
        Returns:
            list: List of usernames.
        """
        return [user["username"] for user in self.collection.find({}, {"username": 1, "_id": 0})]

    def get_children_names(self, username):
        """
        Retrieves a list of children names for a given username.
        
        Args:
            username (str): The username whose children's names are to be fetched.
        
        Returns:
            list: List of child names.
        """
        user = self.collection.find_one({"username": username}, {"children.child_name": 1, "_id": 0})
        return [child["child_name"] for child in user["children"]] if user and "children" in user else []

    def get_child_records(self, username, child_name):
        """
        Retrieves the records of a specific child for a given user.
        
        Args:
            username (str): The username of the user.
            child_name (str): The name of the child whose records are to be fetched.
        
        Returns:
            pd.DataFrame: A DataFrame containing the child's records.
        """
        user = self.collection.find_one({"username": username, "children.child_name": child_name}, {"children": 1, "_id": 0})
        
        if not user:
            return pd.DataFrame(columns=["S.No", "Date", "Time", "Tile Number", "Device Message"])
        
        for child in user.get("children", []):
            if child["child_name"] == child_name:
                records = []
                s_no = 1
                for record in child.get("records", []):
                    for step in record.get("steps", []):
                        records.append([s_no, record["date"], step["time"], step["tile_number"], step["device_message"]])
                        s_no += 1

                return pd.DataFrame(records, columns=["S.No", "Date", "Time", "Tile Number", "Device Message"])

        return pd.DataFrame(columns=["S.No", "Date", "Time", "Tile Number", "Device Message"])

    def get_username_by_credentials(self, email, password):
        """
        Verifies the login credentials and retrieves the username if valid.
        
        Args:
            email (str): The email address of the user.
            password (str): The password of the user.
        
        Returns:
            str: The username if credentials are valid, else "Invalid email or password".
        """
        user = self.collection.find_one({"email": email, "password": password}, {"username": 1, "_id": 0})
        
        if user:
            print(f"Username: {user['username']}")
            return user['username']
        else:
            print("Invalid email or password")

    def add_user(self, email, password, company, username, children=None):
        """
        Adds a new user to the collection.
        
        Args:
            email (str): The email address of the new user.
            password (str): The password for the new user.
            company (str): The company the user belongs to.
            username (str): The username of the new user.
            children (list, optional): A list of children details to associate with the user.
        
        Returns:
            None
        """
        if self.collection.find_one({"email": email}):
            print("User with this email already exists.")
            return
        
        new_user = {
            "email": email,
            "password": password,
            "company": company,
            "username": username,
            "children": children if children else []
        }
        
        self.collection.insert_one(new_user)
        print("User added successfully.")

    def add_child_to_user(self, email, child_name, records=None):
        """
        Adds a new child to a specific user's children list.
        
        Args:
            email (str): The email address of the user.
            child_name (str): The name of the new child.
            records (list, optional): A list of records to associate with the child.
        
        Returns:
            None
        """
        user = self.collection.find_one({"email": email})
        
        if not user:
            print("User not found.")
            return
        
        for child in user.get("children", []):
            if child["child_name"] == child_name:
                print("Child with this name already exists for this user.")
                return
        
        new_child = {
            "child_name": child_name,
            "records": records if records else []
        }

        self.collection.update_one(
            {"email": email},
            {"$push": {"children": new_child}}
        )

        print(f"Child {child_name} added successfully to user {user['username']}.")

    def add_or_append_record(self, email, child_name, date, steps):
        """
        Adds a new record for a child or appends steps to an existing record.
        
        Args:
            email (str): The email address of the user.
            child_name (str): The name of the child.
            date (str): The date of the record.
            steps (list): A list of steps to add to the record.
        
        Returns:
            None
        """
        user = self.collection.find_one({"email": email})

        if not user:
            print("User not found.")
            return

        for child in user.get("children", []):
            if child["child_name"] == child_name:
                existing_records = child.get("records", [])

                for record in existing_records:
                    if record["date"] == date:
                        # Append new steps to the existing record
                        self.collection.update_one(
                            {"email": email, "children.child_name": child_name, "children.records.date": date},
                            {"$push": {"children.$[].records.$[record].steps": {"$each": steps}}},
                            array_filters=[{"record.date": date}]
                        )
                        print(f"Steps appended to existing record for {child_name} on {date}.")
                        return
                
                # If no record with the same date is found, add a new one
                self.collection.update_one(
                    {"email": email, "children.child_name": child_name},
                    {"$push": {"children.$.records": {"date": date, "steps": steps}}}
                )
                print(f"New record created for {child_name} on {date}.")
                return

        print("Child not found.")

    def update_username(self, email, new_username):
        """
        Updates the username of a user based on the email.
        
        Args:
            email (str): The email address of the user.
            new_username (str): The new username to set.
        
        Returns:
            None
        """
        user = self.collection.find_one({"email": email})
        
        if not user:
            print("User not found.")
            return
        
        self.collection.update_one(
            {"email": email},
            {"$set": {"username": new_username}}
        )
        print(f"Username updated successfully to {new_username} for user with email {email}.")

    def update_child_name(self, email, old_child_name, new_child_name):
        """
        Updates the name of a child for a given user based on the child's old name.
        
        Args:
            email (str): The email address of the user.
            old_child_name (str): The current name of the child.
            new_child_name (str): The new name to set for the child.
        
        Returns:
            None
        """
        user = self.collection.find_one({"email": email})
        
        if not user:
            print("User not found.")
            return
        
        updated = False
        for child in user.get("children", []):
            if child["child_name"] == old_child_name:
                # Update the child's name
                self.collection.update_one(
                    {"email": email, "children.child_name": old_child_name},
                    {"$set": {"children.$.child_name": new_child_name}}
                )
                print(f"Child name updated from {old_child_name} to {new_child_name}.")
                updated = True
                break
        
        if not updated:
            print("Child not found.")

# Example usage
if __name__ == '__main__':
    db = TwinkleStepDatabase()

    # Inserting sample data
    db.insert_data()

    # Fetching list of all usernames
    print(db.get_all_usernames())

    # Fetching children of a specific user
    print(db.get_children_names("User1"))

    # Fetching child records of a user
    print(db.get_child_records("User1", "Alice"))

    # Logging in with email and password
    db.get_username_by_credentials("user1@example.com", "hashed_password_1")

    # Adding a new user
    db.add_user("praveen@example.com", "123", "Twinkle Step Inc.", "S Praveen")

    # Adding child details to a specific user
    db.add_child_to_user("praveen@example.com", "Charlie", [{"date": "2025-03-15", "steps": [{"time": "10:30 AM", "tile_number": 1, "device_message": "Step Registered"}]}])

    # Adding records to a specific child
    db.add_or_append_record("user1@example.com", "Alice", "2025-03-10", [{"time": "11:30 AM", "tile_number": 4, "device_message": "Great Step"}])

    # Updating a user name
    db.update_username("user1@example.com", "UpdatedUser1")

    # Updating a child name
    db.update_child_name("user1@example.com", "Alice", "AliceUpdated")
