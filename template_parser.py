import re

def parse_customer_info(input_text):
    lines = [line.strip() for line in input_text.strip().split('\n')]
    
    order_number = "Unknown"
    customer_id = "Unknown"
    name = "Unknown"
    password = "Unknown"
    mac_address = ""
    
    for i, line in enumerate(lines):
        line_upper = line.upper()
        # 1. Order Number & ID/CID
        if line_upper.startswith("ID:") or line_upper.startswith("CID:"):
            # The ID itself
            customer_id = line.split(":", 1)[1].strip()
            # Order number is the line right above the ID/CID
            if i > 0:
                order_number = lines[i-1].strip()
        
        # 2. Name
        elif line_upper.startswith("NAME:"):
            name = line.split(":", 1)[1].strip()
            
        # 3. Password (from Phone)
        elif line_upper.startswith("PHONE:"):
            phone = line.split(":", 1)[1].strip()
            # Remove 855 and replace with 0
            if phone.startswith("855"):
                password = "0" + phone[3:]
            else:
                password = phone
                
        # 4. Username (MAC Address)
        # Assuming the MAC might be on a line starting with MAC: or PPPOE:
        elif "MAC:" in line_upper or line_upper.startswith("PPPOE:"):
            parts = line.split(":", 1)
            if len(parts) > 1:
                potential_mac = parts[1].strip()
                if potential_mac:
                    mac_address = potential_mac

    # Process MAC: remove colons/dashes, take last 8 chars
    clean_mac = re.sub(r'[:-]', '', mac_address)
    if len(clean_mac) >= 8:
        username_prefix = clean_mac[-8:]
    else:
        username_prefix = clean_mac  # fallback if MAC is missing or too short
        
    username = f"{username_prefix}@fiberlink" if username_prefix else "Unknown@fiberlink"

    # 5. Format Output
    output = f"""Done active please help confirm service

ID: {customer_id}
Name: {name}
Username: {username}
Password: {password}
Order : {order_number}
Thank you."""

    return output

if __name__ == "__main__":
    # Test example based on your input
    sample_input = """Dear team 
Please help Active this customer new installation 

188080
CID: 115139
Name: Phuy buykim
Address: borey new world CHamkar Doung, St 07 # 316 sangkat Dangkao, khan Dangkao. Phnom Penh city
Phone: 85599444168
Type: PPPoE
Rate: Frequency : 15 | Package : TODAY Fiber Link-Light 70Mbps
PPPoE: 00:1A:2B:A8:B5:42:B2"""

    print("=== INPUT ===")
    print(sample_input)
    print("\n=== OUTPUT ===")
    print(parse_customer_info(sample_input))
