import pygame
import math
import random
import os

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1200
SCREEN_HEIGHT = 800
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)

# Set up the display
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Post-Apocalyptic Chicken Shooter")
clock = pygame.time.Clock()

class Player:
    def __init__(self, x, y, name):
        self.x = x
        self.y = y
        self.name = name
        self.health = 100
        self.score = 0
        self.speed = 5
        self.size = 40
        self.color = BLUE if name == "Brandon" else GREEN
        self.bullets = []
        self.reload_time = 0
        self.reload_delay = 500  # milliseconds

    def move(self, keys):
        if keys[pygame.K_w]:
            self.y -= self.speed
        if keys[pygame.K_s]:
            self.y += self.speed
        if keys[pygame.K_a]:
            self.x -= self.speed
        if keys[pygame.K_d]:
            self.x += self.speed

    def shoot(self):
        current_time = pygame.time.get_ticks()
        if current_time - self.reload_time > self.reload_delay:
            bullet = Bullet(self.x, self.y, self.name)
            self.bullets.append(bullet)
            self.reload_time = current_time

    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.size)
        # Draw health bar
        pygame.draw.rect(screen, RED, (self.x - 20, self.y - 50, 40, 5))
        pygame.draw.rect(screen, GREEN, (self.x - 20, self.y - 50, 40 * (self.health/100), 5))
        # Draw score
        font = pygame.font.Font(None, 36)
        score_text = font.render(f"{self.name}: {self.score}", True, WHITE)
        screen.blit(score_text, (10, 10 if self.name == "Brandon" else 40))

class Bullet:
    def __init__(self, x, y, player_name):
        self.x = x
        self.y = y
        self.speed = 10
        self.size = 5
        self.player_name = player_name
        self.color = BLUE if player_name == "Brandon" else GREEN

    def move(self):
        self.y -= self.speed

    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.size)

class GiantChicken:
    def __init__(self):
        self.x = SCREEN_WIDTH // 2
        self.y = 100
        self.size = 100
        self.health = 200
        self.speed = 3
        self.attack_pattern = 0
        self.attack_timer = 0
        self.eggs = []

    def move(self):
        self.x += math.sin(pygame.time.get_ticks() / 1000) * self.speed

    def attack(self):
        if pygame.time.get_ticks() - self.attack_timer > 2000:  # Attack every 2 seconds
            self.attack_pattern = (self.attack_pattern + 1) % 3
            self.attack_timer = pygame.time.get_ticks()
            
            if self.attack_pattern == 0:
                # Lay eggs
                self.eggs.append(Egg(self.x, self.y + self.size))
            elif self.attack_pattern == 1:
                # Peck attack
                self.health += 5  # Heal slightly during peck attack
            else:
                # Wing flap attack
                self.eggs.extend([Egg(self.x - 50, self.y + self.size),
                                Egg(self.x + 50, self.y + self.size)])

    def draw(self, screen):
        # Draw chicken body
        pygame.draw.circle(screen, YELLOW, (int(self.x), int(self.y)), self.size)
        # Draw beak
        pygame.draw.polygon(screen, (255, 165, 0), [
            (self.x + self.size//2, self.y),
            (self.x + self.size//2 + 20, self.y - 10),
            (self.x + self.size//2 + 20, self.y + 10)
        ])
        # Draw health bar
        pygame.draw.rect(screen, RED, (self.x - 50, self.y - self.size - 20, 100, 10))
        pygame.draw.rect(screen, GREEN, (self.x - 50, self.y - self.size - 20, 100 * (self.health/200), 10))

class Egg:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.speed = 5
        self.size = 15
        self.color = WHITE

    def move(self):
        self.y += self.speed

    def draw(self, screen):
        pygame.draw.ellipse(screen, self.color, (self.x - self.size//2, self.y - self.size//2, self.size, self.size))

def check_collision(obj1, obj2):
    distance = math.sqrt((obj1.x - obj2.x)**2 + (obj1.y - obj2.y)**2)
    return distance < (obj1.size + obj2.size)

def main():
    # Create game objects
    brandon = Player(SCREEN_WIDTH//4, SCREEN_HEIGHT - 100, "Brandon")
    jj = Player(3*SCREEN_WIDTH//4, SCREEN_HEIGHT - 100, "JJ")
    alec = GiantChicken()

    running = True
    while running:
        # Event handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    brandon.shoot()
                elif event.key == pygame.K_RETURN:
                    jj.shoot()

        # Update game state
        keys = pygame.key.get_pressed()
        brandon.move(keys)
        jj.move(keys)
        alec.move()
        alec.attack()

        # Update bullets
        for player in [brandon, jj]:
            for bullet in player.bullets[:]:
                bullet.move()
                # Check collision with chicken
                if check_collision(bullet, alec):
                    alec.health -= 10
                    player.score += 10
                    player.bullets.remove(bullet)
                # Remove bullets that go off screen
                if bullet.y < 0:
                    player.bullets.remove(bullet)

        # Update eggs
        for egg in alec.eggs[:]:
            egg.move()
            # Check collision with players
            for player in [brandon, jj]:
                if check_collision(egg, player):
                    player.health -= 20
                    alec.eggs.remove(egg)
                    break
            # Remove eggs that go off screen
            if egg.y > SCREEN_HEIGHT:
                alec.eggs.remove(egg)

        # Check for game over
        if alec.health <= 0:
            print(f"Game Over! Brandon: {brandon.score}, JJ: {jj.score}")
            running = False
        if brandon.health <= 0 or jj.health <= 0:
            print("Game Over! The chicken wins!")
            running = False

        # Draw everything
        screen.fill(BLACK)
        
        # Draw post-apocalyptic background elements
        for i in range(5):
            pygame.draw.rect(screen, (100, 100, 100), 
                           (random.randint(0, SCREEN_WIDTH), 
                            random.randint(0, SCREEN_HEIGHT), 
                            20, 20))

        alec.draw(screen)
        brandon.draw(screen)
        jj.draw(screen)
        
        for bullet in brandon.bullets + jj.bullets:
            bullet.draw(screen)
        for egg in alec.eggs:
            egg.draw(screen)

        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()

if __name__ == "__main__":
    main() 