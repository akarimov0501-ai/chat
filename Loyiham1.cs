string ism, familiya;
int yosh;
Console.Write("Ismingiz");
ism = Console.ReadLine();

Console.Write("Familiyangiz");
familiya =Console.readLine();

Console.Write("Yoshingiz");
yosh = Convert.ToInt32(Console.ReadLine());

Console.Write($"To'liq ism va familiya, yosh= {ism} {familiya}, {yosh}");