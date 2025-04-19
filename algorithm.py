def recommend_alternate_tile(selected_tile, forward_step=True):
    """Recommend an alternate tile based on the selected tile and direction."""
    
    def forward_stepping(selected_tile):
        if selected_tile < 1 or selected_tile > 16:
            return "Invalid tile selection. Please select a tile between 1 and 16.", forward_step

        if selected_tile in (15, 16):
            print("Turn Around and Walk in Reverse Way")  
            return reverse_stepping(selected_tile) 

        if selected_tile % 2 == 1:  
            alternate_tile = selected_tile + 3
        else: 
            alternate_tile = selected_tile + 1
        
        return f"Prevous Tile : {selected_tile}\nRecommended tile : {alternate_tile}\nDirection : {'Forward' if forward_step else 'Reverse'}", True  

    def reverse_stepping(selected_tile):
        if selected_tile < 1 or selected_tile > 16:
            return "Invalid tile selection. Please select a tile between 1 and 16.", forward_step

        if selected_tile in (1, 2):
            print("Turn Around and Walk in Forward Way")  
            return forward_stepping(selected_tile)  

        if selected_tile % 2 == 1:  
            alternate_tile = selected_tile - 1
        else: 
            alternate_tile = selected_tile - 3
        
        return f"Prevous Tile : {selected_tile}\nRecommended tile: {alternate_tile}\nDirection : {'Forward' if forward_step else 'Reverse'}", False  

    return forward_stepping(selected_tile) if forward_step else reverse_stepping(selected_tile)

def print_tile_pairs():
    """Print all tile pairs in a formatted way."""
    for i in range(1, 17, 2):
        print(f"( {i}, {i+1} )")

def main():
    """Main function to run the tile recommendation system."""
    print("Welcome to the Tile Recommendation System!")
    print_tile_pairs()
    
    forward_step = True  

    while True:
        try:
            selected_tile = int(input("\nEnter a tile number between 1 and 16 (or 0 to exit): "))
            if selected_tile == 0:
                print("Exiting the program. Goodbye!")
                break
            
            recommendation, forward_step = recommend_alternate_tile(selected_tile, forward_step)
            print(recommendation)  
            
        except ValueError:
            print("Invalid input. Please enter a number between 1 and 16.")

if __name__ == "__main__":
    main()
